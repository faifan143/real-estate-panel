'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Home as HomeIcon, Key, MapPin, Shield, TrendingUp, Users, ChevronRight, Star } from "lucide-react";

export default function Home() {
  const { token, role } = useAuthStore();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    if (token && role) {
      if (role === 'ADMIN') {
        router.push('/admin/requests');
      } else {
        router.push('/properties');
      }
    }
  }, [token, role, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 lg:px-10 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform shadow-lg">
                ع
              </div>
              <span className="font-bold text-2xl text-foreground hidden md:block group-hover:text-primary transition-colors">
                لوحة العقارات
              </span>
            </Link>
            
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-medium hover:bg-muted">
                  تسجيل الدخول
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="font-semibold shadow-md hover:shadow-lg">
                  ابدأ مجاناً
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 lg:px-10 py-16 lg:py-28">
        <div className="max-w-5xl mx-auto">
          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
              <Star className="w-4 h-4 fill-primary" />
              <span>منصة موثوقة</span>
              <Star className="w-4 h-4 fill-primary" />
            </div>
          </div>

          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-1000">
              اكتشف منزل<br />
              <span className="text-primary bg-clip-text">أحلامك</span> معنا
            </h1>
            
            <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              منصتك المثالية للعثور على العقارات المميزة للبيع أو الإيجار في جميع أنحاء المنطقة
            </p>

            {/* Search Bar */}
            <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <div className="bg-white rounded-3xl shadow-2xl p-3 max-w-4xl mx-auto border border-border/50 hover:shadow-3xl transition-all duration-300">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute right-5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="ابحث عن موقع، عقار، أو مدينة..."
                      className="w-full h-16 pr-14 pl-5 rounded-2xl bg-muted/30 border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white text-base transition-all"
                    />
                  </div>
                  <Link href="/properties" className="md:w-auto">
                    <Button size="lg" className="w-full h-16 px-10 text-base font-semibold shadow-lg hover:shadow-xl rounded-2xl">
                      <Search className="w-5 h-5 ml-2" />
                      بحث
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Popular Searches */}
              <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">البحث الشائع:</span>
                {['شقق', 'فلل', 'عقارات تجارية'].map((term) => (
                  <button
                    key={term}
                    className="text-sm px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
              <Link href="/register" className="group">
                <Button size="lg" className="w-full sm:w-auto px-10 text-base font-semibold shadow-lg hover:shadow-xl group-hover:scale-105 transition-all">
                  ابدأ الآن مجاناً
                  <ChevronRight className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/properties">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-10 text-base font-semibold border-2 hover:bg-muted/50">
                  استكشف العقارات
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">500+</div>
            <div className="text-sm text-muted-foreground">عقار متاح</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">1000+</div>
            <div className="text-sm text-muted-foreground">عميل سعيد</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">50+</div>
            <div className="text-sm text-muted-foreground">مدينة</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">دعم فني</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 lg:px-10 py-20">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              لماذا تختارنا؟
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              نقدم لك أفضل تجربة في البحث عن العقارات
            </p>
          </div>
        
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Feature 1 */}
            <div className="text-center space-y-4 p-6 rounded-2xl hover:bg-muted/30 transition-all duration-300 group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg">
                <HomeIcon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                عقارات متنوعة
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                مجموعة واسعة من الشقق والمنازل والعقارات التجارية التي تناسب جميع الاحتياجات والميزانيات
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center space-y-4 p-6 rounded-2xl hover:bg-muted/30 transition-all duration-300 group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                موثوق وآمن
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                نضمن لك أعلى مستويات الأمان والخصوصية في جميع معاملاتك العقارية
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center space-y-4 p-6 rounded-2xl hover:bg-muted/30 transition-all duration-300 group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                دعم متواصل
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                فريق دعم محترف متواجد على مدار الساعة لمساعدتك في كل خطوة
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center space-y-4 p-6 rounded-2xl hover:bg-muted/30 transition-all duration-300 group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg">
                <MapPin className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                مواقع مميزة
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                عقارات في أفضل المواقع والأحياء الراقية مع خرائط تفاعلية
              </p>
            </div>

            {/* Feature 5 */}
            <div className="text-center space-y-4 p-6 rounded-2xl hover:bg-muted/30 transition-all duration-300 group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg">
                <Key className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                إجراءات سهلة
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                نظام حجز ومتابعة متطور يسهل عملية الشراء أو الإيجار
              </p>
            </div>

            {/* Feature 6 */}
            <div className="text-center space-y-4 p-6 rounded-2xl hover:bg-muted/30 transition-all duration-300 group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg">
                <TrendingUp className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                أسعار تنافسية
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                أفضل الأسعار في السوق مع إمكانية المقارنة والتفاوض
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 lg:px-10 py-20">
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            ابدأ رحلتك العقارية اليوم
          </h2>
          <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
            انضم إلى آلاف المستخدمين الذين وجدوا منازل أحلامهم معنا
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-10 text-base font-semibold shadow-xl hover:scale-105 transition-transform">
                إنشاء حساب مجاني
              </Button>
            </Link>
            <Link href="/properties">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-10 text-base font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20">
                تصفح العقارات
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 lg:px-10 py-12 mt-12 border-t">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                ع
              </div>
              <span className="font-bold text-lg">لوحة العقارات</span>
            </div>
            <p className="text-sm text-muted-foreground">
              منصتك الموثوقة للعثور على أفضل العقارات
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/properties" className="hover:text-primary transition-colors">العقارات</Link></li>
              <li><Link href="/register" className="hover:text-primary transition-colors">إنشاء حساب</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">تسجيل الدخول</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">الدعم</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">مركز المساعدة</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">اتصل بنا</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">الأسئلة الشائعة</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">تابعنا</h4>
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 bg-muted hover:bg-primary/10 rounded-lg flex items-center justify-center cursor-pointer transition-colors">
                  <div className="w-5 h-5 bg-muted-foreground rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-center text-muted-foreground pt-8 border-t">
          <p className="text-sm">
            © 2026 لوحة العقارات. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}
