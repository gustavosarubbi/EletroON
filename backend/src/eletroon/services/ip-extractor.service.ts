import { Injectable, Logger } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { logDebug, logWarn } from '../../common/utils/logger.util';

@Injectable()
export class IpExtractorService {
  private readonly logger = new Logger(IpExtractorService.name);

  /**
   * Extrai o IP do cliente do request
   * Tenta diferentes formas de obter o IP em ordem de prioridade
   * Apenas retorna 'unknown' quando realmente não conseguir extrair de nenhuma forma
   */
  extractClientIp(req: ExpressRequest | any): string {
    // Lista de possíveis fontes de IP para tentar
    const ipSources: Array<{ name: string; getter: () => string | undefined }> = [
      // 1. Headers de proxy (mais confiável quando há proxy)
      {
        name: 'x-forwarded-for',
        getter: () => {
          const forwardedFor = req.headers?.['x-forwarded-for'];
          if (forwardedFor) {
            // x-forwarded-for pode conter múltiplos IPs separados por vírgula
            // Pegar o primeiro IP (que é o IP original do cliente)
            const ip = forwardedFor.toString().split(',')[0].trim();
            // Remover espaços e validar que não está vazio
            return ip && ip.length > 0 ? ip : undefined;
          }
          return undefined;
        },
      },
      {
        name: 'x-real-ip',
        getter: () => {
          const realIp = req.headers?.['x-real-ip'];
          if (realIp) {
            const ip = realIp.toString().trim();
            return ip && ip.length > 0 ? ip : undefined;
          }
          return undefined;
        },
      },
      // 2. Headers alternativos (caso o proxy use outros headers)
      {
        name: 'x-client-ip',
        getter: () => {
          const clientIp = req.headers?.['x-client-ip'];
          if (clientIp) {
            const ip = clientIp.toString().trim();
            return ip && ip.length > 0 ? ip : undefined;
          }
          return undefined;
        },
      },
      {
        name: 'cf-connecting-ip',
        getter: () => {
          // Cloudflare
          const cfIp = req.headers?.['cf-connecting-ip'];
          if (cfIp) {
            const ip = cfIp.toString().trim();
            return ip && ip.length > 0 ? ip : undefined;
          }
          return undefined;
        },
      },
      {
        name: 'true-client-ip',
        getter: () => {
          // Cloudflare Enterprise
          const trueIp = req.headers?.['true-client-ip'];
          if (trueIp) {
            const ip = trueIp.toString().trim();
            return ip && ip.length > 0 ? ip : undefined;
          }
          return undefined;
        },
      },
      // 3. IP direto do Express/Node.js
      {
        name: 'req.ip',
        getter: () => {
          if (req.ip) {
            const ip = req.ip.toString().trim();
            // Ignorar IPs locais inválidos
            if (ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== '::ffff:127.0.0.1') {
              return ip;
            }
          }
          return undefined;
        },
      },
      // 4. IP do socket (mais confiável para conexões diretas)
      {
        name: 'socket.remoteAddress',
        getter: () => {
          if (req.socket?.remoteAddress) {
            const ip = req.socket.remoteAddress.toString().trim();
            // Ignorar IPs locais inválidos
            if (ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== '::ffff:127.0.0.1') {
              return ip;
            }
          }
          return undefined;
        },
      },
      // 5. IP da conexão (fallback)
      {
        name: 'connection.remoteAddress',
        getter: () => {
          if (req.connection?.remoteAddress) {
            const ip = req.connection.remoteAddress.toString().trim();
            // Ignorar IPs locais inválidos
            if (ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== '::ffff:127.0.0.1') {
              return ip;
            }
          }
          return undefined;
        },
      },
    ];

    // Tentar cada fonte de IP até encontrar uma válida
    for (const source of ipSources) {
      try {
        const ip = source.getter();
        if (ip && this.isValidIp(ip)) {
          logDebug(this.logger, 'IP extraído', {
            source: source.name,
            ip,
          });
          return ip;
        } else if (ip) {
          // IP encontrado mas não passou na validação - logar mas continuar tentando
          logDebug(this.logger, 'IP encontrado mas inválido', {
            source: source.name,
            ip,
          });
        }
      } catch (error) {
        // Erro ao tentar extrair - continuar para próxima fonte
        logDebug(this.logger, 'Erro ao tentar extrair IP', {
          source: source.name,
          message: (error as Error).message,
        });
      }
    }

    // Se chegou aqui, tentou todas as fontes e não conseguiu extrair um IP válido
    // Mas vamos tentar uma última vez com qualquer IP encontrado (mesmo que não tenha passado na validação)
    for (const source of ipSources) {
      try {
        const ip = source.getter();
        if (ip && ip.length > 0 && ip !== 'unknown') {
          logWarn(this.logger, 'Usando IP sem validação completa', {
            source: source.name,
            ip,
          });
          return ip;
        }
      } catch (error) {
        // Continuar
      }
    }

    // Último recurso: retornar 'unknown' apenas se realmente não conseguir nada
    logWarn(this.logger, 'Nenhum IP válido encontrado após todas as tentativas');
    logDebug(this.logger, 'Fontes tentadas para extração de IP', {
      sources: ipSources.map((s) => s.name),
    });
    return 'unknown';
  }

  /**
   * Valida se o IP tem formato válido (IPv4 ou IPv6)
   * Validação mais flexível para aceitar diferentes formatos
   */
  isValidIp(ip: string): boolean {
    if (!ip || ip === 'unknown' || ip.trim().length === 0) {
      return false;
    }

    const trimmedIp = ip.trim();

    // Limpar prefixo IPv6 mapeado (::ffff:192.168.1.1 -> 192.168.1.1)
    let cleanIp = trimmedIp;
    if (trimmedIp.startsWith('::ffff:')) {
      cleanIp = trimmedIp.replace('::ffff:', '');
      // Se após remover o prefixo for IPv4 válido, considerar válido
      if (this.isValidIPv4(cleanIp)) {
        return true;
      }
    }

    // Validar IPv4
    if (this.isValidIPv4(cleanIp)) {
      return true;
    }

    // Validar IPv6 (mais flexível)
    if (this.isValidIPv6(trimmedIp)) {
      return true;
    }

    return false;
  }

  /**
   * Valida se é um IPv4 válido
   */
  private isValidIPv4(ip: string): boolean {
    // Regex para IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.');
      return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }
    return false;
  }

  /**
   * Valida se é um IPv6 válido (mais flexível)
   */
  private isValidIPv6(ip: string): boolean {
    // IPv6 pode ter vários formatos:
    // - Formato completo: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
    // - Formato compacto: 2001:db8:85a3::8a2e:370:7334
    // - Loopback: ::1
    // - IPv4 mapeado: ::ffff:192.168.1.1
    // - Formato misto: ::ffff:192.168.1.1
    
    // Regex básico para IPv6 (aceita vários formatos)
    const ipv6Patterns = [
      /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, // Formato completo
      /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/, // Formato com zeros comprimidos
      /^::1$/, // Loopback IPv6
      /^::$/, // Endereço não especificado
      /^::ffff:(\d{1,3}\.){3}\d{1,3}$/, // IPv4 mapeado
      /^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/, // Formato com :: no meio
    ];

    return ipv6Patterns.some(pattern => pattern.test(ip));
  }
}

