import { MapTo } from './luma-preview';
import { HeaderComponent } from '../app/components/header.component';
import { CardComponent } from '../app/components/card.component';
import { HeroComponent } from '../app/components/hero.component';
import { RichTextComponent } from '../app/components/rich-text.component';

const siteName = 'wkndangular';

MapTo(`${siteName}/components/header`, HeaderComponent, { displayName: 'Header', placeholder: 'Header Component' });
MapTo(`${siteName}/components/card`, CardComponent, { displayName: 'Card', placeholder: 'Card Component' });
MapTo(`${siteName}/components/hero`, HeroComponent, { displayName: 'Hero', placeholder: 'Hero Component' });
MapTo(`${siteName}/components/richText`, RichTextComponent, { displayName: 'Rich Text', placeholder: 'Rich Text Component' });
