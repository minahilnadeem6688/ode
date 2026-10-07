import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './screens/Home';
import Welcome from './screens/Welcome';
import Tune from './screens/Tune';
import Crafting from './screens/Crafting';
import Ode from './screens/Ode';
import Order from './screens/Order';
import Share from './screens/Share';
import Mine from './screens/Mine';
import Barista from './screens/Barista';
import Kit from './screens/Kit';

// The website is at /, each café's customer menu at /c/:cafe (what the table QR code opens),
// the order board at /barista.
const Phone = ({ children }) => <div className="shell">{children}</div>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/c/:cafe" element={<Phone><Welcome /></Phone>} />
        <Route path="/tune" element={<Phone><Tune /></Phone>} />
        <Route path="/crafting" element={<Phone><Crafting /></Phone>} />
        <Route path="/ode/:id" element={<Phone><Ode /></Phone>} />
        <Route path="/order/:code" element={<Phone><Order /></Phone>} />
        <Route path="/share/:id" element={<Phone><Share /></Phone>} />
        <Route path="/me" element={<Phone><Mine /></Phone>} />
        <Route path="/barista" element={<Barista />} />
        <Route path="/kit" element={<Kit />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
