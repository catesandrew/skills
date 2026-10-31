import type {PrismTheme} from 'prism-react-renderer';

// Token colors measured against the dark code background (#25211a), all >= 4.5:1.
const theme: PrismTheme = {
  plain: {color: '#f3d9c8', backgroundColor: '#25211a'},
  styles: [
    {types: ['comment', 'prolog', 'doctype', 'cdata'], style: {color: '#9a9482', fontStyle: 'italic'}},
    {types: ['punctuation', 'operator'], style: {color: '#a8a291'}},
    {types: ['keyword', 'selector', 'important', 'atrule', 'tag', 'deleted-sign'], style: {color: '#ff8f66'}},
    {types: ['string', 'char', 'attr-value', 'template-string', 'url'], style: {color: '#b5d46a'}},
    {types: ['number', 'boolean', 'constant', 'symbol', 'regex'], style: {color: '#d3aef5'}},
    {types: ['function', 'builtin', 'variable', 'parameter'], style: {color: '#7cc4f0'}},
    {types: ['class-name', 'maybe-class-name', 'attr-name', 'property', 'namespace'], style: {color: '#f0c060'}},
    {types: ['inserted', 'inserted-sign'], style: {color: '#9ad06a'}},
    {types: ['deleted'], style: {color: '#ff8a80'}},
    {types: ['bold'], style: {fontWeight: '700'}},
    {types: ['italic'], style: {fontStyle: 'italic'}},
  ],
};

export default theme;
