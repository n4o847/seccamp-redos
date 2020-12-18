# ReDoS脆弱性検出プログラム

## 本プロジェクトについて

本プロジェクトは「セキュリティ・キャンプ全国大会2020 オンライン」にて行われた、集中開発コースのZトラックのⅢにあたる「ReDoSの検出プログラムの作成とOSSへの適用」講義で、受講生が制作したプロジェクトです。
講義受講生を中心として、講師、チューターらも本プロジェクトに関与しています。

セキュリティ・キャンプについては[こちら](https://www.ipa.go.jp/jinzai/camp/)  
セキュリティ・キャンプ全国大会2020 オンラインについては[こちら](https://www.ipa.go.jp/jinzai/camp/2020/zenkoku2020_index.html)  
講義「ReDoSの検出プログラムの作成とOSSへの適用」については[こちら](https://www.ipa.go.jp/jinzai/camp/2020/zenkoku2020_program_list.html#list_s-z3)

## ReDoSとは?

ReDoS (Regular expression Denial of Service) とは、正規表現が原因で起こるDoS攻撃のことです。

例えば `/^(a|a)*$/` や `/^a*a*$/` のような正規表現には、マッチング処理に文字列の長さの指数時間や二乗時間かかる攻撃文字列が存在し、多大な負荷がかかってしまう可能性があります。

本プロジェクトでは、このような正規表現の脆弱性を検出するプログラムを実装し、JavaScriptの静的解析ツールであるESLintに組み込みます。そしてそれを実際のOSSのソースコードに適用して脆弱性を探し出し、見つけた脆弱性を報告することでOSSに貢献するのが目的です。

## 発表資料

<!-- ここに発表スライドのサムネイルとURL -->

## 使い方

### ブラウザで確認する

ブラウザで正規表現から作られるオートマトンを確認できます。

https://n4o847.github.io/seccamp-redos/

### ESLintプラグインとして使う

このツールをESLintプラグインとして使えるようにしたものが公開されています。

https://github.com/Neccolini/seccampZ3-linter

### ライブラリとして使う

```bash
$ npm install n4o847/seccamp-redos
```

```javascript
const redos = require('seccamp-redos');

const re = /(a|a)*/;
console.log(redos.detectReDoS(re.source, re.flags));
// { status: 'Vulnerable', message: 'Detected EDA.' }
```

### ローカルで動かす

```bash
~/$ git clone https://github.com/n4o847/seccamp-redos.git
~/$ cd seccamp-redos
~/seccamp-redos$ npm install
~/seccamp-redos$ npx ts-node src/test.ts
```

## 動作に必要なもの

- npm
