import { Parser } from 'rerejs';
import { buildEpsilonNFA } from './enfa';
import { eliminateEpsilonTransitions } from './nfa';
import { reverseNFA, determinize } from './dfa';
import { toDOT } from './viz';
import { buildDirectProductNFAs } from './directProduct';
import { buildStronglyConnectedComponents } from './scc';
import { showMessageEDA } from './eda';

function main() {
  const sources = [
    String.raw`a`,
    String.raw`\s`,
    String.raw`a|b`,
    String.raw`ab`,
    String.raw`a*`,
    String.raw`a*?`,
    String.raw`(?:)`,
    String.raw`(?:a|bc)`,
    String.raw`(a*)*`,
    String.raw`(a+)+`,
    String.raw`(a?)?`,
    String.raw`(\w|\d)*`,
    String.raw`(.*)="(.*)"`,
    String.raw`[a-z][0-9a-z]*`,
  ];

  for (const src of sources) {
    console.log(`//`, src);
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
