import MobileScannerClient from './MobileScannerClient';

export const metadata = {
  title: 'スマホJANスキャナ',
};

export default async function MobileScannerPage({ params }) {
  const { sessionId } = await params;

  return <MobileScannerClient sessionId={sessionId} />;
}
