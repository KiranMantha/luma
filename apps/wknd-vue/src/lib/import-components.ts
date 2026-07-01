import Card from '../components/Card.vue';
import Header from '../components/Header.vue';
import HeroWrapper from '../components/HeroWrapper.vue';
import RichTextWrapper from '../components/RichTextWrapper.vue';
import { MapTo } from './luma-preview';

const siteName = 'wkndvue';

MapTo(`${siteName}/components/header`, Header, { displayName: 'Header', placeholder: 'Header Component' });
MapTo(`${siteName}/components/card`, Card, { displayName: 'Card', placeholder: 'Card Component' });
MapTo(`${siteName}/components/hero`, HeroWrapper, { displayName: 'Hero', placeholder: 'Hero Section — click Edit to set title and subtitle' });
MapTo(`${siteName}/components/richText`, RichTextWrapper, { displayName: 'Rich Text', placeholder: 'Rich Text — click Edit to add content' });
