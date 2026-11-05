import { __ } from '@wordpress/i18n';
import { ColorRow, Panel } from '../../../../vendor/softicon-tools/components/Panels';

const Style = ( { attributes, setAttributes, file } ) => {
	const color = ( key ) => ( { value: attributes[ key ], onChange: ( val ) => setAttributes( { [ key ]: val } ) } );

	return <>
		<Panel id="colors" title={ __( 'Colors', 'softicon-document-viewer' ) }>
			<div className="siColors">
				<ColorRow label={ __( 'Background', 'softicon-document-viewer' ) } { ...color( 'bgColor' ) } />
				<ColorRow label={ __( 'Border', 'softicon-document-viewer' ) } { ...color( 'borderColor' ) } />
				<ColorRow label={ __( 'Toolbar background', 'softicon-document-viewer' ) } { ...color( 'toolbarBg' ) } />
				<ColorRow label={ __( 'Toolbar text', 'softicon-document-viewer' ) } { ...color( 'toolbarColor' ) } />
				{ 'sheet' === file?.viewer && <>
					<ColorRow label={ __( 'Table header background', 'softicon-document-viewer' ) } { ...color( 'headBg' ) } />
					<ColorRow label={ __( 'Table header text', 'softicon-document-viewer' ) } { ...color( 'headColor' ) } />
				</> }
			</div>
		</Panel>
	</>;
};

export default Style;
