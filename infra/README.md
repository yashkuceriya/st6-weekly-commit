# Local infrastructure

Postgres 16.4 + LocalStack (SNS/SQS) + MailHog (email capture) for local development.

```bash
# from repo root
yarn infra:up      # bring up containers
yarn infra:down    # stop
yarn infra:reset   # wipe volumes and restart
```

## Services

| Service     | Port  | Notes                                                   |
| ----------- | ----- | ------------------------------------------------------- |
| Postgres    | 5432  | DB `weekly_commit`, user/pwd `weekly_commit` (dev only) |
| LocalStack  | 4566  | SNS + SQS — used in dev profile instead of real AWS     |
| MailHog UI  | 8025  | Web UI for inspecting sent emails (dev Outlook stub)    |
| MailHog SMTP| 1025  | SMTP receiver for dev mail                              |
