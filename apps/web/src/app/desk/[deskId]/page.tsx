import DeskClient from './DeskClient';

export function generateStaticParams() {
    return [{ deskId: 'placeholder' }];
}

export default function Page() {
    return <DeskClient />;
}
