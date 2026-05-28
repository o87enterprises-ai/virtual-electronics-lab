import { simulate } from 'spicey';

self.onmessage = (e) => {
  const { netlist } = e.data;
  try {
    const result = simulate(netlist);
    self.postMessage({ success: true, data: result });
  } catch (err) {
    self.postMessage({ success: false, error: err.message });
  }
};
