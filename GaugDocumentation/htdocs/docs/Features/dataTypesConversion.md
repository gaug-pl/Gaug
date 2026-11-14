# Converting Data Types

::: warning
This feature is still in progress and is not complete.
:::

## `stringify(...super)`
> Turns the passed arguments into strings and returns them back
```gaug
var Strings = stringify(true, false, 5.0, 2);
print(Strings);

```

`Output: true false 5 2` 

## `numberify(val: ${number, string})`
> Turns the passed argument into a number and returns it back
```gaug
var Number = numberify("5");
print(Number);

```

`Output: 5` 

## `floatify(val: ${number, string})`
> Turns the passed argument into a float and returns it back

## `booleanify(val: string)`
> Turns the passed string argument into a bool and returns it back
```gaug
var Boolean = booleanify("true");
print(Boolean);
```

`Output: true`