# Odoo モジュールとしての NFT Client 作成

- [Odoo モジュールとしての NFT Client 作成](#odoo-モジュールとしての-nft-client-作成)
  - [目標](#目標)
    - [NFT 連携シナリオ](#nft-連携シナリオ)
    - [計画](#計画)
  - [fabric-samplesのインストール](#fabric-samplesのインストール)

## 目標

下記の NFT シナリオを実装します、BlockChain の Network は Fabric で構築します、UI は Odoo で実装します。

### NFT 連携シナリオ

・ユーザ：管理者ユーザ、ユーザ A、ユーザ B ユーザ C

アクション

管理者ユーザがユーザ A に対して新規アセットを付与し Value 値は 100 とする。

管理者ユーザがユーザ B に対して新規アセットを付与し、Value 値は 80 とする。

管理者ユーザがユーザ C に対して新規アセットを付与し、Value 値は 50 とする。

ユーザ A がユーザ B に Value を 60 譲渡する

（B>A および C>A を確認）

ユーザ C がユーザ A に Value を 50 譲渡

（A>C および B>A を確認）

管理者ユーザがユーザ C に対し、新規アセットを付与し、Value 値を 100 とする。

仕様：異なるアセットのバリューは合計して評価する

（C ＞ B を確認する。）

### 計画

1. 検証と便利のため、[fabric-samples](https://github.com/hyperledger/fabric-samples) の test-network を利用して Network を構築します。
2. 連携シナリオによって、既存の Sample がありませんので、独自の ChainCode を作成が必要です。
3. [fabric-samples](https://github.com/hyperledger/fabric-samples)の test-network は組織`org1.example.com`と`org2.example.com`２つありますので、`org1.example.com` のみを利用します。
4. まず、[fabric-samples]の CLI ツールで、上記の NFT シナリオを実現します
5. Odoo で、直接 Fabric SDK を利用できないので、express.js で新規開発 ChainCode に対しての REST API を開発が必要です。
6. Odoo と新規開発 REST API を利用して fabric_abctest と連携して、上記シナリオを実現します。

## [fabric-samples](https://github.com/hyperledger/fabric-samples)のインストール

```sh
$ sudo apt-get update -y
$ sudo apt-get upgrade -y
$ sudo apt-get install git curl docker-compose -y
```

Version を確認します

```sh
$ docker --version
Docker version 20.10.12, build 20.10.12-0ubuntu4
$ docker-compose --version
docker-compose version 1.29.2, build unknown
```

Docker 起動確認

```sh
$ sudo systemctl start docker
$ sudo systemctl enable docker
```

ユーザーグループを追加して、再起動

```sh
$ sudo usermod -aG docker $USER
$ sudo reboot
```

実行ファイルとサンプルのインストール

```sh
$ mkdir -p ~/prjs/sdl/bc/fabric-2.4.3
$ cd ~/prjs/sdl/bc/fabric-2.4.3
$ curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.4.3 1.5.2
```

test network 起動

```
cd fabric-samples/test-network
./network.sh up createChannel -c mychannel -ca
```

CLI 環境設定

```sh
export PATH=${PWD}/../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
```
