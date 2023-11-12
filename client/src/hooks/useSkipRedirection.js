import { useLocation } from 'react-router-dom';

const useSkipRedirection = () => {
  const location = useLocation();
  return location.pathname.startsWith('/join/');
};

export default useSkipRedirection;
