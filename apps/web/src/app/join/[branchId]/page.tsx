import JoinClient from './JoinClient';

export function generateStaticParams() {
    return [{ branchId: 'placeholder' }];
}

export default function Page() {
    return <JoinClient />;
}
