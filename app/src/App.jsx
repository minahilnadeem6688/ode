import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Site from './site/Site';
import Home from './site/Home';
import How from './site/How';
import Cafes from './site/Cafes';
import Wall from './site/Wall';
import Pricing from './site/Pricing';
import GetOde from './site/GetOde';
import Login from './site/Login';
import Account from './site/Account';
import Dashboard from './site/Dashboard';
import Welcome from './screens/Welcome';
import Tune from './screens/Tune';
import Crafting from './screens/Crafting';
import Ode from './screens/Ode';
import Order from './screens/Order';
import Share from './screens/Share';
import Mine from './screens/Mine';
import Barista from './screens/Barista';
import Kit from './screens/Kit';
import KitStills from './screens/KitStills';
import Nav from './site/Nav';

// The website is at /, each café's customer menu at /c/:cafe (what the table QR code opens),
// the order board at /barista.
// Every screen outside the website still carries the ode bar, so home is always one tap away.
const Phone = ({ children }) => <div className="shell"><Nav solid />{children}</div>;
const Framed = ({ children }) => <div className="framed"><Nav solid />{children}</div>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Site />}>
          <Route index element={<Home />} />
          <Route path="how-it-works" element={<How />} />
          <Route path="for-cafes" element={<Cafes />} />
          <Route path="wall" element={<Wall />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="get-ode" element={<GetOde />} />
          <Route path="login" element={<Login />} />
          <Route path="account" element={<Account />} />
          <Route path="*" element={<Home />} />
        </Route>
        <Route path="/c/:cafe" element={<Phone><Welcome /></Phone>} />
        <Route path="/tune" element={<Phone><Tune /></Phone>} />
        <Route path="/crafting" element={<Phone><Crafting /></Phone>} />
        <Route path="/ode/:id" element={<Phone><Ode /></Phone>} />
        <Route path="/order/:code" element={<Phone><Order /></Phone>} />
        <Route path="/share/:id" element={<Phone><Share /></Phone>} />
        <Route path="/me" element={<Phone><Mine /></Phone>} />
        <Route path="/barista" element={<Framed><Barista /></Framed>} />
        <Route path="/dashboard" element={<Framed><Dashboard /></Framed>} />
        <Route path="/kit" element={<Kit />} />
        <Route path="/kit/stills" element={<KitStills />} />
      </Routes>
    </BrowserRouter>
  );
}
