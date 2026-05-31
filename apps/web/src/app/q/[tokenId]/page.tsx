import QueueStatusClient from './QueueStatusClient';

export function generateStaticParams() {
    return [{ tokenId: 'placeholder' }];
}

export default function Page() {
    return <QueueStatusClient />;
}
