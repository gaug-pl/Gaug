# env Library

::: warning
This feature is still in progress and is not complete.
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