import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import Viz from 'viz.js';
import { Module, render } from 'viz.js/full.render.js';
import { Parser } from 'rerejs';
import * as redos from '../src/lib';

const viz = new Viz({ Module, render });

function App() {
  const [source, setSource] = useState(`(a|a)*`);
  const [error, setError] = useState<string>();
  const [graph0, setGraph0] = useState('');
  const [graph1, setGraph1] = useState('');
  const [graph2, setGraph2] = useState('');
  const [graph3, setGraph3] = useState('');

  const check = async () => {
    try {
      const pattern = new Parser(source).parse();
      const enfa = redos.buildEpsilonNFA(pattern);
      const enfaDOT = redos.toDOT(enfa, { horizontal: true });
      // @ts-ignore
      const image0 = await viz.renderImageElement(enfaDOT);
      setGraph0(image0.src);
      const nfa = redos.eliminateEpsilonTransitions(enfa);
      const nfaDOT = redos.toDOT(nfa, { horizontal: true });
      // @ts-ignore
      const image1 = await viz.renderImageElement(nfaDOT);
      setGraph1(image1.src);
      const rnfa = redos.reverseNFA(nfa);
      const rnfaDOT = redos.toDOT(rnfa, { horizontal: true });
      // @ts-ignore
      const image2 = await viz.renderImageElement(rnfaDOT);
      setGraph2(image2.src);
      const dfa = redos.determinize(rnfa);
      const dfaDOT = redos.toDOT(dfa, { horizontal: true });
      // @ts-ignore
      const image3 = await viz.renderImageElement(dfaDOT);
      setGraph3(image3.src);
      setError(undefined);
    } catch (e) {
      setError(String(e));
      console.error(e);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    setSource((e.target as HTMLInputElement).value);
  };

  const handleCheck = (e: React.FormEvent<HTMLButtonElement>) => {
    check();
    e.preventDefault();
  };

  return (
    <>
      <div className="jumbotron">
        <h1>ReDoS</h1>
        <form>
          <div className="form-group">
            <input type="text" className="form-control" value={source} onInput={handleInput} />
          </div>
          <button className="btn btn-primary" onClick={handleCheck}>Check</button>
        </form>
      </div>
      <div className="container">
        {error && (
          <div className="alert alert-danger">{error}</div>
        )}
        {graph0 && <img src={graph0} alt=""/>}
        <p>↓ Eliminate ε-transitions</p>
        {graph1 && <img src={graph1} alt=""/>}
        <p>↓ Reverse</p>
        {graph2 && <img src={graph2} alt=""/>}
        <p>↓ Determinize</p>
        {graph3 && <img src={graph3} alt=""/>}
      </div>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('app'));
