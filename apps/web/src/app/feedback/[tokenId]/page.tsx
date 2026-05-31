import FeedbackClient from './FeedbackClient';

export function generateStaticParams() {
    return [{ tokenId: 'placeholder' }];
}

export default function Page() {
    return <FeedbackClient />;
}
