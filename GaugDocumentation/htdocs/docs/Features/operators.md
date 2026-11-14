# Operators
There are 3 kinds of operators in Gaug, which include:
- **Arithmetic Operators**: Operators for mathematical equations
- **Logical Operators**: They return a boolean if a condition is true or false.
- **Relational Operators**: Operators similar to Logical Operators, but they mainly involve numbers.

## Arithmetic Operators
### `a + b`
> Adds both values a and b then returns the result.

```gaug
var Number1 = 5;
var Number2 = 10;

print( Number1 + Number2 ); # 15
```

### `a - b`
> Subtracts both values a and b then returns the result.

```gaug
var Number1 = 10;
var Number2 = 5;

print( Number1 - Number2 ); # 5
```

### `a * b`
> Multiplies both values a and b then returns the result.

```gaug
var Number1 = 10;
var Number2 = 5;

print( Number1 * Number2 ); # 50
```

### `a / b`
> Divides both values a and b then returns the result.

```gaug
var Number1 = 20;
var Number2 = 2;

print( Number1 / Number2 ); # 10
```

## Logical Operators
### `a and b`
> Returns true if a and b both return a value not null.

```gaug
var a = true;
var b = "true";

if (a and b) -> (
    print("Both are true!");
) else -> (
    print("Both are not true!");
);

# Output: Both are true!
```

### `a or b`
> Returns true if a or b return a value not null.

```gaug
var a = true;
var b = null;

if (a or b) -> (
    print("One is true!");
) else -> (
    print("Both are not true!");
);

# Output: One is true!
```

### `not a`
> Returns true if a is a value not null, otherwise false.

```gaug
var a = true;

if (not a) -> (
    print("This condition will never happen");
) else -> (
    print("This will be printed since a is true!");
);

# Output: This will be printed since a is true!
```

## Relational Operators

### `a == b`
> Returns true if a is equal to b.

```gaug
var a = 5;
var b = 20;

if (a == b) -> (
    print("This condition will never happen since a is 5 but b is 20!");
) else -> (
    print("a is not equal to b!");
);

# Output: a is not equal to b!
```

### `a >= b`
> Returns true if a is equal to or higher than b.

```gaug
var a = 30;
var b = 1;

if (a >= b) -> (
    print("a is higher than or equal to b!");
) else -> (
    print("a is less than b!");
);

# Output: a is higher than or equal to b!
```

### `a <= b`
> Returns true if a is equal or less than b.

```gaug
var a = 1;
var b = 3;

if (a <= b) -> (
    print("a is less than or equal b!");
) else -> (
    print("a is higher than b!");
);

# Output: a is less than or equal b!
```