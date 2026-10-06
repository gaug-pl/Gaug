# Garbage Collector

::: warning
It is not recommended to use `gc.disable()` unless you know what you are doing.

If not handled well you may cause memory heaps and lead to your program crashing!
:::

::: warning
This feature is still in progress and is not complete.
:::

## `gc.enable()`
> Enables the Garbage Collector, automatically turned on.

## `gc.disable()`
> Disables the Garbage Collector.

## `gc.collect()`
> Forces a collection regardless of gc is enabled or the threshold.

```gaug
gc.disable();

var Variable >>> int = 0;

while (Variable < 100) -> (
    print("Variable: " + Variable)
)

gc.collect(); # once we are done we collect the unused garbage
```

`Output: Current Garbage: 0`

## `gc.setthreshold(threshold: number)`
> Sets the Garbage Collector's allocation threshold. The allocation threshold is automatically set to 256 by default.

```gaug
print("Current Threshold: " + gc.getthreshold());

var OldThreshold = gc.setthreshold(1000);
print("Old Threshold", OldThreshold, "New Threshold:", gc.getthreshold());

var i = 0;
while (i < 5000) -> (
    var s = "item " + i;
    i += 1;
);

print(gc.count());
```

`Output:`

```
Current Threshold: 256
Old Threshold 256 New Threshold: 1000
5
```

## `gc.getthreshold() >>> int`
> Returns the Garbage Collector's allocation threshold.

```gaug
print("Current Threshold: " + gc.getthreshold());
gc.setthreshold(1000);
print("New Threshold:", gc.getthreshold());
```

`Output: Current Threshold: 256`