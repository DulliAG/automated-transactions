import { TransactionService } from '../service/transaction.service';

describe('Check if provided IBAN is valid', () => {
  test('(Valid) NH092843', () => {
    expect(TransactionService.validateIban('NH092843')).toBe(true);
  });

  test('(Invalid) NH09e84e', () => {
    expect(TransactionService.validateIban('NH09e84e')).toBe(false);
  });

  test('(Invalid) NH09284f', () => {
    expect(TransactionService.validateIban('NH09284f')).toBe(false);
  });

  test('(Invalid) WH092843', () => {
    expect(TransactionService.validateIban('WH092843')).toBe(false);
  });
});
