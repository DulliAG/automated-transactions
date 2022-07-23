import { TransactionService } from '../service/transaction.service';

describe('Check if the transaction should execute', () => {
  test('Daily, but start-date is in the future', () => {
    expect(
      TransactionService.validateExecutionDate(
        {
          id: 1,
          type: 'DAILY',
          start_date: '2022-07-05',
          end_date: '2022-07-14',
        },
        new Date('2022-07-03')
      )
    ).toBe(false);
  });

  test('Daily, should execute during period', () => {
    expect(
      TransactionService.validateExecutionDate(
        {
          id: 1,
          type: 'DAILY',
          start_date: '2022-07-03',
          end_date: '2022-07-14',
        },
        new Date('2022-07-03')
      )
    ).toBe(true);
  });

  test("Daily, should'nt execute after period", () => {
    expect(
      TransactionService.validateExecutionDate(
        {
          id: 1,
          type: 'DAILY',
          start_date: '2022-07-01',
          end_date: '2022-07-02',
        },
        new Date('2022-07-03')
      )
    ).toBe(false);
  });

  test('Weekly, should execute on start-date', () => {
    expect(
      TransactionService.validateExecutionDate(
        {
          id: 1,
          type: 'WEEKLY',
          start_date: '2022-07-03',
          end_date: '2022-07-30',
        },
        new Date('2022-07-03')
      )
    ).toBe(true);
  });

  test('Weekly, should execute one week after start', () => {
    expect(
      TransactionService.validateExecutionDate(
        {
          id: 1,
          type: 'WEEKLY',
          start_date: '2022-07-03',
          end_date: '2022-07-30',
        },
        new Date('2022-07-10')
      )
    ).toBe(true);
  });

  test("Weekly, should'nt execute", () => {
    expect(
      TransactionService.validateExecutionDate(
        {
          id: 1,
          type: 'WEEKLY',
          start_date: '2022-07-03',
          end_date: '2022-07-30',
        },
        new Date('2022-07-11')
      )
    ).toBe(false);
  });

  test('Month, run on start-date', () => {
    expect(
      TransactionService.validateExecutionDate(
        {
          id: 1,
          type: 'MONTHLY',
          start_date: '2022-02-28',
          end_date: '2022-07-30',
        },
        new Date('2022-02-28')
      )
    ).toBe(true);
  });

  test("Month, doesn't contains date", () => {
    expect(
      TransactionService.validateExecutionDate(
        {
          id: 1,
          type: 'MONTHLY',
          start_date: '2022-02-29',
          end_date: '2022-07-30',
        },
        new Date('2022-03-31')
      )
    ).toBe(false);
  });

  test('Month, run 2 months after start', () => {
    expect(
      TransactionService.validateExecutionDate(
        {
          id: 1,
          type: 'MONTHLY',
          start_date: '2022-02-14',
          end_date: '2022-05-30',
        },
        new Date('2022-03-14')
      )
    ).toBe(true);
  });

  test('Month, run 3 months after start on last day', () => {
    expect(
      TransactionService.validateExecutionDate(
        {
          id: 1,
          type: 'MONTHLY',
          start_date: '2022-02-28',
          end_date: '2022-06-30',
        },
        new Date('2022-05-31')
      )
    ).toBe(true);
  });

  test('Planned, should execute on start and end-date', () => {
    expect(
      TransactionService.validateExecutionDate(
        {
          id: 1,
          type: 'PLANNED',
          start_date: '2022-07-03',
          end_date: '2022-07-03',
        },
        new Date('2022-07-03')
      )
    ).toBe(true);
  });

  test("Planned, should'nt execute after start and end-date", () => {
    expect(
      TransactionService.validateExecutionDate(
        {
          id: 1,
          type: 'PLANNED',
          start_date: '2022-07-03',
          end_date: '2022-07-03',
        },
        new Date('2022-07-04')
      )
    ).toBe(false);
  });

  test("Planned, should'nt execute on different start and end-date", () => {
    expect(
      TransactionService.validateExecutionDate(
        {
          id: 1,
          type: 'PLANNED',
          start_date: '2022-07-03',
          end_date: '2022-07-04',
        },
        new Date('2022-07-04')
      )
    ).toBe(false);
  });
});
