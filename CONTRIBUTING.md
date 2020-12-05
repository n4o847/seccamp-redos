# 貢献にあたって

## はじめに

こんにちは、本プロジェクトに興味を示していただき、ありがとうございます。
このドキュメントでは貢献方法と貢献にあたっての決まり事を記しています。
貢献をする前に、ご一読いただければ幸いです。

## 本プロジェクトについて

本プロジェクトは「セキュリティ・キャンプ全国大会2020 オンライン」にて行われた、集中開発コースのZトラックのⅢにあたる「ReDoSの検出プログラムの作成とOSSへの適用」講義で、受講生が制作したプロジェクトです。
講義受講生を中心として、講師、チューターらも本プロジェクトに関与しています。

セキュリティ・キャンプについては[こちら](https://www.ipa.go.jp/jinzai/camp/)  
セキュリティ・キャンプ全国大会2020 オンラインについては[こちら](https://www.ipa.go.jp/jinzai/camp/2020/zenkoku2020_index.html)  
講義「ReDoSの検出プログラムの作成とOSSへの適用」については[こちら](https://www.ipa.go.jp/jinzai/camp/2020/zenkoku2020_program_list.html#list_s-z3)

## Issue/Pull Requestについて

本プロジェクトではGitHubの機能である「[Issue Template](https://docs.github.com/ja/free-pro-team@latest/github/building-a-strong-community/about-issue-and-pull-request-templates#issue%E3%81%AE%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88)」や「[Pull Request Template](https://docs.github.com/ja/free-pro-team@latest/github/building-a-strong-community/about-issue-and-pull-request-templates#%E3%83%97%E3%83%AB%E3%83%AA%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%E3%81%AE%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88)」を用いて開発を行っています。  
まず貢献するにあたって、貢献内容に合わせてIssue Templateを選択し、Issueを立ててください。
また、実際にコードを書いてPull Requestを提出する際は、適切なPull Request Templateを選択し、Pull Requestを提出してください。

## ブランチについて

本プロジェクトでは、git-flowベースのブランチルールを制定しています。
ブランチの切り方はそれほど複雑ではないので、貢献者の皆さまはこれを守っていただければ幸いです。

- メインブランチ: `master`
  - メインのブランチです。ここに機能する最新のコードがある前提です。
  - メインブランチから定期的にタグ(or リリース)を切ります。
- 開発ブランチ: `develop`
  - 開発ブランチです。ここをメインに開発し、`master`からブランチを切り、問題なくコードが動くようであれば`master`にマージします。
  - `master`ブランチへのマージはPull Request経由で行い、メンテナー複数人で合意を取ったうえでのマージをするようにします。
  - `master`ブランチへのマージの前に、`package.json`内の`version`を変更し忘れていないかを確認します。
- 機能追加ブランチ: `feature/{ISSUE_NUMBER}-**`
  - なにか新しい機能を実装するときや、リファクタをかけるときにこのブランチネーミングを使います。
  - 基本的にまずは実装する機能についてIssueで提示します(`feature`ブランチにおいてどんな機能追加のコードが書かれているのかを把握しやすくするため)
  - ブランチのチェックアウト元・マージ先は`develop`か、別の`feature/`系統のブランチのみとします。
- 問題・バグ修正用ブランチ: `fix/{ISSUE_NUMBER}-**` or `fix/**`
  - 何かしら実装のバグや問題があった時、このブランチネーミングを使い、ブランチを切ります。
  - `feature/`と同じく、まずIssueを立てることを推奨します。(あくまで推奨レベル。Pull Requestで言及されていればよい)
  - ブランチのチェックアウト元・マージ先は`develop`か、`feature/`系統のブランチのみとします。
- 緊急のバグ等修正用ブランチ: `hotfix/{ISSUE_NUMBER}-**` or `hotfix/**`
  - `master`ブランチにおいてバグや問題が確認されてしまった場合、緊急の修正が必要になります。その際にこのブランチネーミングを用います。
  - `fix/`と同じく、まずIssueを立てることを推奨します。(あくまで推奨レベル。Pull Requestで言及されていればよい)
  - ブランチのチェックアウト元・マージ先は`master`のみとします。また、同じ内容のPull Requestを`develop`向けに`fix/`で作ることを推奨します。

