import { TransactionService } from '../service/transaction.service';

describe('Check if the transaction should execute', () => {
  test('Daily, should execute', () => {
    expect(TransactionService.shouldExecuteTransaction('DAILY', new Date())).toBe(true);
  });

  test('Weekly, should not execute', () => {
    let start = new Date();
    start.setDate(start.getDate() + 6);
    expect(TransactionService.shouldExecuteTransaction('WEEKLY', start)).toBe(false);
  });

  test('Weekly, should execute', () => {
    let start = new Date();
    start.setDate(start.getDate() + 7);
    expect(TransactionService.shouldExecuteTransaction('WEEKLY', start)).toBe(true);
  });

  test('Monthly, should not execute', () => {
    let start = new Date();
    start.setDate(start.getDate() - 19);
    expect(TransactionService.shouldExecuteTransaction('MONTHLY', start)).toBe(false);
  });

  test('Monthly, should execute', () => {
    let start = new Date('2022-07-13');
    let today = new Date('2022-06-13');
    expect(TransactionService.shouldExecuteTransaction('MONTHLY', start, today)).toBe(true);
  });

  test('Monthly(29.Feb on 30.April), should not execute', () => {
    let start = new Date('2022-02-29');
    let today = new Date('2022-03-30');
    expect(TransactionService.shouldExecuteTransaction('MONTHLY', start, today)).toBe(false);
  });

  test('Planned, should not execute', () => {
    let execution = new Date('2022-06-14');
    let today = new Date('2022-06-13');
    expect(TransactionService.shouldExecuteTransaction('PLANNED', execution, today)).toBe(false);
  });

  test('Planned, should execute', () => {
    let execution = new Date('2022-06-13');
    let today = new Date('2022-06-13');
    expect(TransactionService.shouldExecuteTransaction('PLANNED', execution, today)).toBe(true);
  });
});
