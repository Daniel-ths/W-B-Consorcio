export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-700">
      <main className="max-w-4xl mx-auto px-6 py-16">
        
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 uppercase tracking-tighter">
          Política de Privacidade
        </h1>

        <div className="prose prose-slate max-w-none space-y-6 text-sm md:text-base leading-relaxed">
          <p className="font-bold">Última atualização: {new Date().getFullYear()}</p>

          <p>
            A sua privacidade é importante para nós. É política do <strong>WB Auto</strong> respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site <a href="https://wbcconsorcio.com.br" className="text-blue-600 underline">WB Auto</a>, e outros sites que possuímos e operamos.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Informações que coletamos</h2>
          <p>
            Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Uso de Dados</h2>
          <p>
            Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Compartilhamento de Dados</h2>
          <p>
            Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Cookies</h2>
          <p>
            O nosso site usa cookies para melhorar a experiência do usuário. Ao continuar navegando, você concorda com o uso de cookies.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Seus Direitos (LGPD)</h2>
          <p>
            Você é livre para recusar a nossa solicitação de informações pessoais, entendendo que talvez não possamos fornecer alguns dos serviços desejados. Conforme a Lei Geral de Proteção de Dados (LGPD), você tem o direito de acessar, corrigir, portar e eliminar seus dados.
          </p>

          <hr className="my-8 border-gray-200"/>

          <p>
            O uso continuado de nosso site será considerado como aceitação de nossas práticas em torno de privacidade e informações pessoais. Se você tiver alguma dúvida sobre como lidamos com dados do usuário e informações pessoais, entre em contato conosco.
          </p>
        </div>
      </main>
    </div>
  );
}