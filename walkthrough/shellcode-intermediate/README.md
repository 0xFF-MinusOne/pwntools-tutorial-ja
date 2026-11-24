# シェルコード

**注意**: まず[基本のシェルコードチュートリアル](../shellcode-basic/README.md)を確認してください。

コマンドラインで使えるツールをひととおり見たので、それに対応する Python 版を学ぶのは簡単です。

## `asm`

`asm` ツールは、ほぼ同じように動きます。

```python
from pwn import *

nop = asm('nop')
arm_nop = asm('nop', arch='arm')
```

Pwntools のほかの多くの機能と同様に、`context` の設定を認識します。

```python
context.arch = 'powerpc'
powerpc_nop = asm('nop')
```

## `disasm`

`disasm` ツールも、ほぼ同じように動きます。

```python
from pwn import *

print disasm('\x90')
# nop

print disasm('\xff\x00\x40\xe3', arch='arm')
#    0:   e34000ff        movt    r0, #255        ; 0xff
```

## `shellcraft`

shellcraft モジュールも、ほぼ同じように動きます。デフォルトでは、`shellcraft` モジュールは `context` の設定で現在有効な OS とアーキテクチャを使います。

あるいは、完全なパスを指定して特定のテンプレートを直接呼び出すこともできます。

```python
from pwn import *

print shellcraft.sh()
#    /* push '/bin///sh\x00' */
#    push 0x68
#    push 0x732f2f2f
#    push 0x6e69622f
#
#    /* call execve('esp', 0, 0) */
#    mov ebx, esp
#    xor ecx, ecx
#    push 0xb
#    pop eax
#    cdq /* Set edx to 0, eax is known to be positive */
#    int 0x80

context.arch = 'arm'
# print shellcraft.sh()
#     adr r0, bin_sh
#     mov r2, #0
#     push {r0, r2}
#     mov r1, sp
#     svc SYS_execve
# bin_sh: .asciz "/bin/sh"


# パスを指定して直接呼び出すこともできます。
print shellcraft.i386.linux.sh()
```

引数を取る関数は、通常の関数とまったく同じように動作します。

```python
from pwn import *

print shellcraft.pushstr("Hello!")
#    /* push 'Hello!\x00' */
#    push 0x1010101
#    xor dword ptr [esp], 0x101206e
#    push 0x6c6c6548

print shellcraft.pushstr("Goodbye!")
#    /* push 'Goodbye!\x00' */
#    push 0x1
#    dec byte ptr [esp]
#    push 0x21657962
#    push 0x646f6f47
```
