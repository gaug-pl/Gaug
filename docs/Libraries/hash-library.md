# Hash Library
This library is used for handling files in Gaug.

::: fn hash.sha256
param string: string - String to encode using sha256.
returns string

> Returns the passed string in sha256.

```gaug
var Encoded = hash.sha256("Hello!");
print(Encoded); # 334d016f755cd6dc58c53a86e183882f8ec14f52fb05345887c8a5edd42c87b7
```
:::


::: fn hash.fnv1a
param string: string - String to encode using fnv1a.
returns string

> Returns the passed string in fnv1a.

```gaug
var Encoded = hash.fnv1a("Hello!");
print(Encoded); # aa21c9de
```
:::

::: fn hash.murmur3
param string: string - String to encode using murmur3.
returns string

> Returns the passed string in murmur3.

```gaug
var Encoded = hash.murmur3("Hello!");
print(Encoded); # 7e268e20
```
:::

::: fn hash.argon2
param string: string - String to encode using Argon2id.
returns string

> Returns the passed string in Argon2id.

```gaug
var Encoded = hash.argon2("Hello!");
print(Encoded); # $argon2id$v=19$m=65536,t=3,p=1$9NxQvy4pC5RlHy7AJZhxTA$pAQxVukQlKMS8QZwOSHP+HPGBpRz7X63ihoanxP+vLg
```
:::


::: fn hash.verifyArgon2
param Argon2idString: string - The original Argon2 text.
param stringToCheck: string - String to check for Argon2.
returns boolean

> Returns true if the passed string is same as the original Argon2id.

```gaug
var Encoded = hash.argon2("Hello!");
var IsSame = hash.verifyArgon2(Encoded, "Hello!");
print(IsSame); # true
```
:::
