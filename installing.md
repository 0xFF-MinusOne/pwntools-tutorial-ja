目次
=====

  * [Pwntools のインストール](#installing-pwntools)
    * [インストールの確認](#verifying-installation)
    * [他のアーキテクチャ](#foreign-architectures)

<a id="installing-pwntools"></a>
# Pwntools のインストール

手順はできるだけ簡単にしてあります。「公式にサポートされている」プラットフォームは Ubuntu 18.04 と 20.04 だけです。自動テストを行っているのがこの 2 つだけだからです。

```sh
$ apt-get update
$ apt-get install python3 python3-pip python3-dev git libssl-dev libffi-dev build-essential
$ python3 -m pip install --upgrade pip
$ python3 -m pip install --upgrade pwntools
```

<a id="verifying-installation"></a>
## インストールの確認

次のコマンドが成功すれば、問題なくインストールできています。

```sh
$ python -c 'from pwn import *'
```

<a id="foreign-architectures"></a>
## 他のアーキテクチャ

他のアーキテクチャ向けのコードをアセンブルまたは逆アセンブルしたい場合は、適切な `binutils` のインストールが必要です。Ubuntu と Mac OS X のユーザー向けの[インストール手順][binutils]が docs.pwntools.com にあります。

```sh
$ apt-get install binutils-*
```

[binutils]: https://pwntools.readthedocs.org/en/latest/install/binutils.html
