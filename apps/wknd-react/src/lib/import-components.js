import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { MapTo } from './luma-preview';

const siteName = 'wkndreact';

MapTo(`${siteName}/components/header`, Header, { displayName: 'header', placeholder: 'Header Component' });
MapTo(`${siteName}/components/card`, Card, { displayName: 'card', placeholder: 'Card Component' });
