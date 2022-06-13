```
PRODUCTION=true
APPLICATION=<ENTER>

SUPABASE_URL=<ENTER>
SUPABASE_ANON_KEY=<ENTER>

DB_HOST=<ENTER>
DB_USER=<ENTER>
DB_PASSWORD=<ENTER>
DB_DATABASE=<ENTER>

TRANSFER_TOKEN=<ENTER>
LARAVEL=<ENTER>
XSRF=<ENTER>
```

## Datenbank

| Spalte      | Typ                               |
| ----------- | --------------------------------- |
| `id`        | `int(10) unsigned auto-increment` |
| `execution` | `int(10) unsigned`                |
| `sender`    | `varchar(8)`                      |
| `receiver`  | `varchar(8)`                      |
| `balance`   | `double`                          |
| `note`      | `varchar(80)`                     |

| Spalte       | Typ                                  |
| ------------ | ------------------------------------ |
| `id`         | `int(10) unsigned auto-increment`    |
| `type`       | `DAILY / WEEKLY / MONTHLY / PLANNED` |
| `start_date` | `date`                               |
| `end_date`   | `date`                               |
