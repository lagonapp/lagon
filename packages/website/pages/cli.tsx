import Layout from 'lib/Layout';
import Button from 'lib/components/Button';
import Text from 'lib/components/Text';
import useVerificationCode from 'lib/hooks/useVerificationCode';

const CLI = () => {
  const { data } = useVerificationCode();

  const copyCode = async () => {
    await navigator.clipboard.writeText(data?.code || '');
  };

  return (
    <Layout title="Log in to the CLI">
      <Text size="2xl">{data?.code}</Text>
      <Text>This is your verification code to login in the CLI. Copy it and paste it in your terminal.</Text>
      <Button variant="primary" onClick={copyCode}>
        Copy code
      </Button>
    </Layout>
  );
};

export default CLI;
