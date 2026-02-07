---
name: db-explorer
description: Multi-engine database explorer for querying Postgres, MySQL, and SQLite.
metadata:
  {
    "MagmaBot":
      {
        "emoji": "🗄️",
        "requires": { "env": ["DATABASE_URL"] },
        "primaryEnv": "DATABASE_URL"
      },
  }
---

# DB Explorer Skill

Use this skill to perform high-intensity queries and data extraction from external databases. MagmaBot acts as an intelligent bridge, non-destructively exploring schemas and generating reports.

## Supported Engines

* **PostgreSQL**: `postgresql://user:password@localhost:5432/dbname`
* **MySQL**: `mysql://user:password@localhost:3306/dbname`
* **SQLite**: `sqlite:///path/to/database.db`

## Usage Examples

**Schema Discovery:**
> "List all tables in the connected database and describe the 'users' table structure."

**Data Extraction:**
> "Find the top 10 most active users in the last 30 days based on the 'transactions' table."

**Complex Joins:**
> "Generate a report combining 'orders' and 'customers' to find high-value clients in New York."

## Advanced Capabilities

* **JSON Export**: "Query the last 5 logs and return them as a JSON array."
* **Safety Mode**: MagmaBot defaults to `SELECT` and `DESCRIBE` operations unless explicitly instructed to mutate data.
