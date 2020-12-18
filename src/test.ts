import { Parser } from 'rerejs';
import { buildEpsilonNFA } from './enfa';
import { eliminateEpsilonTransitions } from './nfa';
import { reverseNFA, determinize } from './dfa';
import { prune } from './pruning';
import { buildStronglyConnectedComponents } from './scc';
import { buildDirectProductGraphs } from './directProduct';
import { showMessageEDA } from './eda';
import { buildTripleDirectProductGraphs } from './tripleDirectProduct';
import { showMessageIDA } from './ida';
import { toDOT } from './viz';

function main(): void {
  const sources: [source: string, flags?: string][] = [
    [String.raw`a`],
    [String.raw`.`],
    [String.raw`\s`],
    [String.raw`a|b`],
    [String.raw`ab`],
    [String.raw`^ab$`],
    [String.raw`a*`],
    [String.raw`a*?`],
    [String.raw`(?:)`],
    [String.raw`(?:a|bc)`],
    [String.raw`(a|b)*`],
    [String.raw`^(a|b)*`],
    [String.raw`(a|b)*$`], //IDA
    [String.raw`^(a|b)*$`],
    [String.raw`(a*)*`], //
    [String.raw`^(a*)*`], //
    [String.raw`(a*)*$`], // EDA IDA
    [String.raw`^(a*)*$`], // EDA
    [String.raw`(a+)+`],
    [String.raw`^(a+)+$`], // EDA
    [String.raw`(a?)?`],
    [String.raw`(\w|\d)*`],
    [String.raw`^(\w|\d)*$`], // EDA
    [String.raw`[a-z][0-9a-z]*`],
    [String.raw`^[a-z][0-9a-z]*$`],
    [String.raw`a[a-z]`, 'i'],
    [String.raw`a*a*`],
    [String.raw`^a*a*$`], // IDA1
    [String.raw`(.*)="(.*)"`], // IDA2
    [String.raw`^(.*)="(.*)"$`], // IDA2
    [String.raw`(.*|(a|a)*)`], // 枝切り1
    [String.raw`(a|a)*?.*`], // 枝切り2
    [String.raw`^a|b$|aa`],
    [String.raw`^ab^c`], // エラー回復用
    [String.raw`^$`], // 空文字に一致
  ];

  for (const [src, flags] of sources) {
    console.log(`//`, src, flags);
    const pat = new Parser(src, flags).parse();
    const enfa = buildEpsilonNFA(pat);
    if (enfa.type === 'Error') {
      // detectReDosを用いる場合、Objectが返されるがここではmessageのみ
      console.error('Error Message:', enfa.error.message);
      continue;
    }
    console.log(toDOT(enfa));
    console.log(`//`, src, `eliminated`);
    const nfa = eliminateEpsilonTransitions(enfa);
    console.log(toDOT(nfa));
    console.log(`//`, src, `reversed`);
    const rnfa = reverseNFA(nfa);
    console.log(toDOT(rnfa));
    console.log(`//`, src, `determinized`);
    const dfa = determinize(rnfa);
    console.log(toDOT(dfa));
    console.log(`//`, src, `pruned`);
    const pnfa = prune(nfa, dfa);
    console.log(toDOT(pnfa));
    const sccs = buildStronglyConnectedComponents(pnfa);
    const dps = buildDirectProductGraphs(sccs);
    console.log(`//`, src, `has EDA?: `, showMessageEDA(pnfa, dfa, dps));
    const tdps = buildTripleDirectProductGraphs(sccs, pnfa);
    console.log(`//`, src, `has IDA?: `, showMessageIDA(pnfa, dfa, tdps));
  }
}

if (require.main === module) {
  main();
}
