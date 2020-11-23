import { Parser } from 'rerejs';
import { buildEpsilonNFA } from './enfa';
import { eliminateEpsilonTransitions } from './nfa';
import { reverseNFA, determinize } from './dfa';
import { toDOT } from './viz';
import { buildDirectProductNFAs } from './directProduct';
import { buildStronglyConnectedComponents } from './scc';
import { showMessageEDA } from './eda';
import { buildTripleDirectProductNFA, buildTripleDirectProductNFAs } from './tripleDirectProduct';
import { showMessageIDA } from './ida';

function main() {
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
    [String.raw`(.*)="(.*)"`],
    [String.raw`[a-z][0-9a-z]*`],
    [String.raw`a[a-z]`, 'i'],
    [String.raw`a*a*`], // IDA典型例
  ];

  for (const [src, flags] of sources) {
    console.log(`//`, src, flags);
    const pat = new Parser(src).parse();
    const enfa = buildEpsilonNFA(pat);
    console.log(toDOT(enfa));
    console.log(`//`, src, `eliminated`);
    const nfa = eliminateEpsilonTransitions(enfa);
    console.log(toDOT(nfa));
    console.log(`//`, src, `strongly connected components`);
    const sccs = buildStronglyConnectedComponents(nfa);
    console.log(`//`, src, `direct product`);
    const dps = buildDirectProductNFAs(sccs);
    for (const dp of dps) {
      console.log(toDOT(dp));
    }
    console.log(`//`, src, `has EDA?: `, showMessageEDA(dps));
    console.log('//', src, `triple direct product`);
    const tdps = buildTripleDirectProductNFAs(sccs, nfa);
    console.log(`//`, src, `has IDA?: `, showMessageIDA(tdps));
    console.log(`//`, src, `reversed`);
    const rnfa = reverseNFA(nfa);
    console.log(toDOT(rnfa));
    console.log(`//`, src, `determinized`);
    const dfa = determinize(rnfa);
    console.log(toDOT(dfa));
  }
}

if (require.main === module) {
  main();
}
