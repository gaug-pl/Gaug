# env Library

::: warning
**You need to fetch this Library using** `get gauglib env`**.**
:::

::: fn env.load
param envFile?: string
param value: number or string or null - Anything goes.
> Loads the current env file.

```gaug

```
:::

::: fn env.get
param envFile: string - .env file to get
param key?: super - Value to get. If not passed then it will return the whole env file.
> Returns the .env file.

```gaug

```
:::

::: fn env.has
param envFile: string - .env file to check
param key?: super - Value to get. If not passed then it will return the whole env file.
> Checks if the .env file contains that key.

```gaug

```
:::

::: fn env.set
param envFile: string - .env file to set
> Changes a value in the .env file.

```gaug

```
:::