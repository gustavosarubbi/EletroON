export default () => ({
  meter: {
    maxPower: parseInt(process.env.MAX_POWER || '1000000', 10) || 1000000,
    textDecimalDivisor: parseInt(process.env.TEXT_DECIMAL_DIVISOR || '100', 10) || 100,
    minDataFields: parseInt(process.env.MIN_DATA_FIELDS || '3', 10) || 3,
  },
});

