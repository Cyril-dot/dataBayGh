import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

export default function NotFound() {
  return (
    <div className="page-center">
      <div className="stack" style={{ textAlign: 'center' }}>
        <Icon name="travel_explore" size={40} />
        <h1>404</h1>
        <p className="muted">This page wandered off the network.</p>
        <Link className="btn btn--primary" to="/">
          Back home
        </Link>
      </div>
    </div>
  );
}
