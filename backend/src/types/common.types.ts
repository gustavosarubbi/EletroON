export interface IncomingData {
  id?: string;
  [key: string]: unknown;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
  meterIds?: number[];
}

export interface ReadingData {
  timestamp: Date;
  pa: number;
  pb: number;
  pc: number;
  pt: number;
  qa: number;
  qb: number;
  qc: number;
  qt: number;
  epa_c: number;
  epb_c: number;
  epc_c: number;
  ept_c: number;
  epa_g: number;
  epb_g: number;
  epc_g: number;
  ept_g: number;
  iarms: number;
  ibrms: number;
  icrms: number;
  uarms: number;
  ubrms: number;
  ucrms: number;
  pfa: number;
  pfb: number;
  pfc: number;
  pft: number;
}