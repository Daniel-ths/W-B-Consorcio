"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Save, 
  Shield, 
  Camera, 
  Loader2, 
  ArrowLeft,
  Upload
} from "lucide-react";

// Função de Máscara para Telefone
const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Estados do Formulário
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(""); 
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  // Estado para nova foto (preview)
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Estado de Senha
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace("/login");
        return;
      }

      setUser(user);
      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
        setRole(profile.role || "vendedor");
        setAvatarUrl(profile.avatar_url || "");
      }
      setLoading(false);
    };

    getProfile();
  }, [router, supabase]);

  // Handler para formatar telefone enquanto digita
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(maskPhone(e.target.value));
  };

  // Handler para selecionar foto
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file)); // Cria preview local
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalAvatarUrl = avatarUrl;

      // 1. Upload da Foto (se houver nova)
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars') // Certifique-se de criar esse bucket no Supabase
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        finalAvatarUrl = publicUrlData.publicUrl;
      }

      // 2. Atualizar Tabela Profiles
      const updates = {
        full_name: fullName,
        phone: phone,
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Atualizar Senha (Se preenchido)
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          alert("As senhas não conferem.");
          setSaving(false);
          return;
        }
        if (newPassword.length < 6) {
          alert("A senha deve ter pelo menos 6 caracteres.");
          setSaving(false);
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (passwordError) throw passwordError;
      }

      // Atualiza estado local para refletir a nova foto oficial
      setAvatarUrl(finalAvatarUrl);
      setAvatarFile(null); // Limpa o arquivo pendente
      
      alert("Perfil atualizado com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh(); // Atualiza a página para garantir que novos dados apareçam

    } catch (error: any) {
      console.error(error);
      alert("Erro ao atualizar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500">Carregando perfil...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 mb-8">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Minha Conta</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: CARTÃO DE IDENTIFICAÇÃO + FOTO */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            
            {/* Área da Foto */}
            <div className="relative group">
              <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-3xl mb-4 overflow-hidden border-4 border-white shadow-lg">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} />
                )}
              </div>
              
              {/* Botão de Trocar Foto */}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-4 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors"
                title="Alterar foto"
              >
                <Camera size={16} />
              </button>
              
              {/* Input Invisível */}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileSelect}
              />
            </div>

            <h2 className="font-bold text-lg text-slate-900 mt-2">{fullName || "Sem Nome"}</h2>
            <p className="text-sm text-slate-500 mb-4">{email}</p>
            
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
              ${role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}
            `}>
              {role === 'admin' ? 'Administrador' : 'Vendedor'}
            </div>
          </div>

          <div className="bg-blue-600 p-6 rounded-xl shadow-lg shadow-blue-200 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Shield size={20} className="text-blue-200"/>
              <h3 className="font-bold">Segurança</h3>
            </div>
            <p className="text-blue-100 text-sm mb-4">Sua conta está protegida. Lembre-se de usar uma senha forte.</p>
          </div>
        </div>

        {/* COLUNA DIREITA: FORMULÁRIO DE EDIÇÃO */}
        <div className="md:col-span-2">
          <form onSubmit={handleUpdateProfile} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">
            
            {/* Dados Pessoais */}
            <div>
              <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2 pb-2 border-b border-slate-100">
                <User size={20} className="text-slate-400"/> Dados Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nome Completo</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Telefone / WhatsApp</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input 
                      value={phone}
                      onChange={handlePhoneChange} // Usa a máscara aqui
                      maxLength={15} // Limita tamanho
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Email (Não editável)</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input 
                      value={email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Alterar Senha */}
            <div>
              <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Lock size={20} className="text-slate-400"/> Alterar Senha
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nova Senha</label>
                  <input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="Deixe em branco para manter"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Confirmar Senha</label>
                  <input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="Confirme a nova senha"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-gray-200"
              >
                {saving ? (
                  <> <Loader2 size={18} className="animate-spin"/> Salvando... </>
                ) : (
                  <> <Save size={18}/> Salvar Alterações </>
                )}
              </button>
            </div>

          </form>
        </div>

      </main>
    </div>
  );
}