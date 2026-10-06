# Math Library
This library is inspired by Lua's math library, Go check out [Lua](https://www.lua.org)

::: warning
This feature is still in progress and is not complete.
:::

## `math.inf`
> Returns Infinity (int value)

```gaug
var Infinity = math.inf;

print(Infinity);
```

`Output: inf`

## `math.pi`
> Returns the value of Pi down to 20 digits, but in the output it gets rounded to 5 digits

```gaug
var Pi = math.pi;

print(Pi);
```

`Output: 3.14159`

## `math.min(...: int)`
> Returns the lowest number passed in the parameters

```gaug
var minimumValue = math.min(1, 5, 7, 2, 0, -5, math.inf);

print(minimumValue);
```

`Output: -5`

## `math.sqrt(Value: int)`
> Returns the square root of the passed number.

```gaug
var Answer = math.sqrt(16);

print(Answer);
```

`Output: 8`

## `math.abs(Value: int)`
> Returns the absolute value of the passed number.

```gaug
var Answer = math.abs(-126);

print(Answer);
```

`Output: 126`