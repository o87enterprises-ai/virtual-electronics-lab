import { Circuit, analyse } from 'spicey';

self.onmessage = (e) => {
  const { netlist } = e.data;
  try {
    const circuit = new Circuit(netlist);
    const result = analyse(circuit, { dc: true });
    self.postMessage({ success: true, data: result });
  } catch (err) {
    self.postMessage({ success: false, error: err.message });
  }
};
