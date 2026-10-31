import type {PrismTheme} from 'prism-react-renderer';

// Token colors measured against the light code background (#ebe5d6), all >= 4.5:1.
const theme: PrismTheme = {
  plain: {color: '#3a1f12', backgroundColor: '#ebe5d6'},
  styles: [
    {types: ['comment', 'prolog', 'doctype', 'cdata'], style: {color: '#6b6556', fontStyle: 'italic'}},
    {types: ['punctuation', 'operator'], style: {color: '#5b564b'}},
    {types: ['keyword', 'selector', 'important', 'atrule', 'tag', 'deleted-sign'], style: {color: '#9f3914'}},
    {types: ['string', 'char', 'attr-value', 'template-string', 'url'], style: {color: '#4a6a1c'}},
    {types: ['number', 'boolean', 'constant', 'symbol', 'regex'], style: {color: '#7a3f9e'}},
    {types: ['function', 'builtin', 'variable', 'parameter'], style: {color: '#1b5c8a'}},
    {types: ['class-name', 'maybe-class-name', 'attr-name', 'property', 'namespace'], style: {color: '#7f5200'}},
    {types: ['inserted', 'inserted-sign'], style: {color: '#2f6b1f'}},
    {types: ['deleted'], style: {color: '#a3261a'}},
    {types: ['bold'], style: {fontWeight: '700'}},
    {types: ['italic'], style: {fontStyle: 'italic'}},
  ],
};

export default theme;
