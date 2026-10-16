# Math Library
::: warning
This feature is still in progress and is not complete.
:::

::: const math.inf 
type number
> Returns the largest possible number.

```gaug
var Infinity = math.inf;

print(Infinity); # inf
```
:::

::: const math.low
type number
> Returns the smallest number possible. (Excluding NaN)

::: const math.pi
type number
> Returns the value of Pi down to 20 digits, but in the output it gets rounded to 5 digits

```gaug
var Pi = math.pi;

print(Pi); # 3.14159
```

::: fn math.sqrt
param Value: number - The value to get the square root of.

> Returns the square root of the passed number.

```gaug
var Answer = math.sqrt(16);

print(Answer); # 8
```
:::

::: fn math.abs
param Value: number - The value to get the absolute value of.

> Returns the absolute value of the passed number.

```gaug
var Answer = math.abs(-100);

print(Answer); # 100
```
:::

::: fn math.min
param ...val: number - The values to get the minimum of.

> Returns the lowest number passed in the parameters.

```gaug
var minimumValue = math.min(1, 5, 7, 2, 0, -5, math.inf);

print(minimumValue); # -5
```
:::

::: fn math.max
param ...val: number - The values to get the maximum of.

> Returns the highest number passed in the parameters.

```gaug
var minimumValue = math.min(1, 5, 7, 2, 0, -5, math.inf);

print(minimumValue); # inf
```
:::

::: fn math.floor
param Value: number - The value to floor.

> Returns a number rounded down to the nearest whole integer that is less than or equal to the given number.

```gaug
var Floored = math.floor(5.2);

print(Floored); # 5
```
:::

::: fn math.ceil
param Value: number

> Returns a number rounded up to the nearest whole integer (toward positive infinity).

```gaug
var ceil = math.ceil(5.2);

print(ceil); # 6
```
:::

::: fn math.round
param Value: number - The value to round.

> Returns a number with its decimal point rounded.

```gaug
var Rounded = math.floor(5.5);

print(Rounded); # 5
```
:::

::: fn math.pow
param Value: number - The value to apply the power to.
param multiplier: number - The multiplier of the power.

> Returns the number powered to the multiplier.

```gaug
var Result = math.pow(2, 2);

print(Result); # 4
```
:::

::: fn math.sin
param Value: number - The value to take the sine of.

> Calculates the sine of an angle and returns it. (Expects radians)

```gaug
var Result = math.sin(360);

print(Result); # 0.958916
```
:::

::: fn math.cos
param Value: number - The value to evaluate the cos of.

> Calculates the sine of an angle and returns it. (Expects radians)

```gaug

```
:::

::: fn math.tan
param Value: number - The value to evaluate the tan of.

> Template

```gaug

```
:::

::: fn math.log
param Value: number

> Template

```gaug

```
:::

::: fn math.random
param Value: number

> Template

```gaug

```
:::

::: fn math.randomseed
param Value: number

> Template

```gaug

```
:::

::: fn math.modulo
param Value: number
param Divisor: number

> Template

```gaug

```
:::