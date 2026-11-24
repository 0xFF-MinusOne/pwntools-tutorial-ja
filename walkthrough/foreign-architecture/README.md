# 異なるアーキテクチャ

この例は「基本的なバッファオーバーフロー」の例とまったく同じですが、異なるアーキテクチャ(foreign architecture)のバイナリを扱う方法を示します。

これをすべて動かすには、クロスアーキテクチャのライブラリをいくつかインストールする必要があります。この例では、Ubuntu で依存関係を揃えやすい ARM を使います。

異なるアーキテクチャのツールチェーンの詳しい設定手順は、私の [StackExchange の投稿][post]にあります。話題は MIPS ですが、手順はまったく同じです。

説明は不要でコマンドだけ欲しい場合は、次のとおりです。

```sh
sudo apt-get install qemu qemu-user qemu-user-static
sudo apt-get install gdb-multiarch
sudo apt-get install libc6-armhf-armel-cross
sudo apt-get install gcc-arm-linux-gnueabihf
sudo mkdir /etc/qemu-binfmt
sudo ln -s /usr/arm-linux-gnueabihf /etc/qemu-binfmt/arm
```

[post]: http://reverseengineering.stackexchange.com/a/8917/12503
