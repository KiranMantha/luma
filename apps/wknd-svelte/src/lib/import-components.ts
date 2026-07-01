import Card from '../components/Card.svelte';
import Header from '../components/Header.svelte';
import HeroWrapper from '../components/HeroWrapper.svelte';
import RichTextWrapper from '../components/RichTextWrapper.svelte';
import { MapTo } from './luma-preview';

const siteName = 'wkndsvelte';

MapTo(`${siteName}/components/header`, Header, { displayName: 'Header', placeholder: 'Header Component' });
MapTo(`${siteName}/components/card`, Card, { displayName: 'Card', placeholder: 'Card Component' });
MapTo(`${siteName}/components/hero`, HeroWrapper, { displayName: 'Hero', placeholder: 'Hero Section — click Edit to set title and subtitle' });
MapTo(`${siteName}/components/richText`, RichTextWrapper, { displayName: 'Rich Text', placeholder: 'Rich Text — click Edit to add content' });
