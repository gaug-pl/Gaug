# String Library

::: warning
This feature is still in progress and is not complete.
:::

::: fn string.sub
param string: string - The string to extract the substring from
param startIndex: int - The starting index.
param endIndex?: int - The ending index.
returns string

> Returns a substring from a string.

```gaug
var Original = "Hello World!";
var Sub = string.sub(Original, 0, 6);

print(Sub); # Hello
```
:::

::: fn string.split
param string: string - The string to split.
param seperator: string - The seperator inside the string, you cannot use empty strings to get every character.
returns list

> Splits the string using the passed seperator and returns a list.

```gaug
var Original = "Hello World!";
var Sub = string.split(Original, " ");

print(Sub); # [Hello, World!]
```
:::

::: fn string.join
param seperator: string - The seperator to add in the middle of list keys.
param List: list - The seperator inside the string, you cannot use empty strings to get every character.
returns string

> Joins every item in the list by the passed seperator then returns it.

```gaug
var GroceryList = {
    "Milk",
    "Banana",
    "Apple",
    "Lettuce",
};

var Seperator = ", ";
var NewString = string.join(Seperator, GroceryList);

print(NewString); # Milk, Banana, Apple, Lettuce
```
:::

::: fn string.upper
param string: string - The string to capitalize.
returns string

> Returns the fully-capitalized string

```gaug
var Original = "Hello World!";
var Capitalized = string.upper(Original);

print(Capitalized); # HELLO WORLD!
```
:::

::: fn string.lower
param string: string - The string to decapitalize.
returns string

> Returns the fully decapitalized string

```gaug
var Original = "Hello World!";
var Capitalized = string.lower(Original);

print(Capitalized); # hello world!
```
:::

::: fn string.find
param haystack: string - The string to find the needle in.
param needle: string - The string to be found inside the haystack.
returns number

> Returns the found needle inside the haystack.

```gaug
var Original = "Hello World!";
var Found = string.find(Original, "Hello");
var NotFound = string.find(Original, "Banana");

print(Found); # 0 (At First letter)
print(NotFound); # -1 (Not found)
```
:::

::: fn string.trim
param string: string - The string to trim.
returns string

> Returns the trimmed and cleaned up string.

```gaug
var Original = "            Hello World!            ";
var Trimmed = string.trim(Original);

print(Trimmed); # Hello World!
```
:::

::: fn string.replace
param string: string - The target string to search and replace in.
param oldString: string - The replacement string that will be replaced.
param newString: string - The replacement string that will replace.
param count?: int - The maximum amount of replacements that can be made.
returns string

> Returns the string replaced

```gaug
var Original = "Hello World!";
var Replaced = string.replace(Original, "Hello", "Bye");

print(Replaced); # Bye World!
```
:::

::: fn string.startswith
param string: string - The string to search.
param prefix: string - The string to check for.
returns boolean

> Returns true if the passed string starts with the prefix, otherwise false.

```gaug
var Original = "Hello World!";
var startsWith = string.startswith("Hello");

print(startsWith); # true
```
:::

::: fn string.endswith
param string: string - The string to trim.
param suffix: string - The string to check for.
returns boolean

> Returns true if the passed string ends with the suffix, otherwise false.

```gaug
var Original = "Hello World!";
var endsWith = string.endswith("World");

print(endsWith); # Output will be false, since it ends with "World!", not "World".
```
:::
