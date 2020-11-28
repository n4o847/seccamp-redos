import { Parser } from 'rerejs';
import { buildEpsilonNFA } from './enfa';
import { eliminateEpsilonTransitions } from './nfa';
import { reverseNFA, determinize } from './dfa';
import { toDOT } from './viz';
import { buildDirectProductGraphs } from './directProduct';
import { buildStronglyConnectedComponents } from './scc';
import { showMessageEDA } from './eda';
import { buildTripleDirectProductGraphs } from './tripleDirectProduct';
import { showMessageIDA } from './ida';
import { prune } from './pruning';

function main(): void {
  const sources: [source: string, flags?: string][] = [
    [String.raw`a`],
    [String.raw`\s`],
    [String.raw`a|b`],
    [String.raw`ab`],
    [String.raw`a*`],
    [String.raw`a*?`],
    [String.raw`(?:)`],
    [String.raw`(?:a|bc)`],
    [String.raw`(a|b)*`],
    [String.raw`(a*)*`],
    [String.raw`(a+)+`],
    [String.raw`(a?)?`],
    [String.raw`(\w|\d)*`],
    [String.raw`[a-z][0-9a-z]*`],
    [String.raw`a[a-z]`, 'i'],
    [String.raw`a*a*`], // IDA1
    [String.raw`(.*)="(.*)"`], //IDA2
    [String.raw`(.*|(a|a)*)`], // 枝切り典型
  ];

  for (const [src, flags] of sources) {
    console.log(`//`, src, flags);
    const pat = new Parser(src).parse();
    const enfa = buildEpsilonNFA(pat);
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
    console.log(`//`, src, `cut leaf`);
    const lcnfa = prune(nfa, dfa);
    console.log(toDOT(lcnfa));
    console.log(`//`, src, `strongly connected components`);
    const sccs = buildStronglyConnectedComponents(lcnfa);
    const dps = buildDirectProductGraphs(sccs);
    console.log(`//`, src, `has EDA?: `, showMessageEDA(dps));
    const tdps = buildTripleDirectProductGraphs(sccs, lcnfa);
    console.log(`//`, src, `has IDA?: `, showMessageIDA(tdps));
  }
}

if (require.main === module) {
  main();
}
