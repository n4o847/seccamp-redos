import { CharSet } from 'rerejs';
import {
	TripleDirectProductNFA,
	State,
	NonNullableTransition,
	StronglyConnectedComponentNFA,
} from './types';
import { enumerateCharset } from './char';
import { intersect } from './util';

export function buildTripleDirectProductNFAs(
	sccs: StronglyConnectedComponentNFA[],
): TripleDirectProductNFA[] {
	return sccs.map((scc) => buildTripleDirectProductNFA(scc));
}

export function buildTripleDirectProductNFA(
	sccNFA: StronglyConnectedComponentNFA,
): TripleDirectProductNFA {
	return new TripleDirectProducer(sccNFA).build();
}

export function getLeftString(state: State): string {
  return state.id.split('_')[0];
}

export function getRightString(state: State): string {
  return state.id.split('_')[1];
}

class TripleDirectProducer {
  private newStateList: State[] = [];
  private newTransitions: Map<State, NonNullableTransition[]> = new Map();
  private newStateToOldStateSet: Map<State, [State, State, State]> = new Map();

	constructor(private sccNFA: StronglyConnectedComponentNFA) {}

	build(): TripleDirectProductNFA {
		for (const ls of this.sccNFA.stateList) {
			for (const cs of this.sccNFA.stateList) {
				for (const rs of this.sccNFA.stateList) {
					this.createState(ls, cs, rs);
				}
			}
		}

		for (const [lq, lds] of this.sccNFA.transitions) {
			for (const ld of lds) {
				for (const [cq, cds] of this.sccNFA.transitions) {
					for (const cd of cds) {
						for (const [rq, rds] of this.sccNFA.transitions) {
							for (const rd of rds) {
								let source = this.getState(lq, cq, rq);
								if(source === null) {
									source = this.createState(lq, cq, rq);
								}

								let dest = this.getState(ld.destination, cd.destination, rd.destination);
								if(dest === null) {
									dest = this.createState(ld.destination, cd.destination, rd.destination);
								}

								// 積集合をとる
								const le = enumerateCharset(ld.charSet);
								const ce = enumerateCharset(cd.charSet);
								const re = enumerateCharset(rd.charSet);

								const lcre = Array.from(intersect(le, intersect(ce, re))).sort((a, b) => a - b);

								if (lcre.length > 0) {
									const data = [];
									
									data.push(lcre[0]);
									// 連続した文字コード列を１つにまとめる
									for (let i = 0; i < lcre.length - 1; i++) {
										if (lcre[i + 1] - lcre[i] > 1) {
										data.push(lcre[i] + 1);
										data.push(lcre[i + 1]);
										}
									}
									data.push(lcre[lcre.length - 1] + 1);
									
									const charSet = new CharSet(data);
									this.addTransition(source, charSet, dest);
								}
							}
						}
					}
				}
			}
		}

		return {
			type: 'TripleDirectProductNFA',
			stateList: this.newStateList,
			transitions: this.newTransitions,
		}
	}

	getState(leftState: State, centerState: State, rightState: State): State | null {
		for (const [ns, os] of this.newStateToOldStateSet) {
			if (os[0] === leftState && os[1] === centerState && os[2] === rightState) {
				return ns;
			}
		}
		return null;
	}

	// 直積は前の状態をスペース区切りに
	createState(leftState: State, centerState: State, rightState: State): State {
		const state: State = {
			id: `${leftState.id}_${centerState.id}_${rightState.id}`,
		};

		this.newStateList.push(state);
    this.newTransitions.set(state, []);
    this.newStateToOldStateSet.set(state, [leftState, centerState, rightState]);
    return state;
	}

	private addTransition(
		source: State,
		charSet: CharSet,
		destination: State,
	): void {
		this.newTransitions.get(source)!.push({ charSet, destination });
	}
}