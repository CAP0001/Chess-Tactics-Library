from django.urls import reverse_lazy
from django.views.generic import FormView, CreateView, ListView, DetailView
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404, render
from django.contrib.auth.forms import UserCreationForm
from .forms import LoginForm, UpdateProfileForm
from .models import UserProfile
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
import json
from django.http import JsonResponse
from .models import Game, ChessTactic


def chess_board_view(request):
  game, created = Game.objects.get_or_create(id=1)
  return render(request, 'board.html', {'game': game})


def update_game(request, game_id):
  if request.method == 'POST':
    data = json.loads(request.body)
    new_fen = data.get('fen')

    game = get_object_or_404(Game, id=1)
    game.fen = new_fen
    game.save()

    return JsonResponse({'status': 'success', 'fen': game.fen})
  return JsonResponse({'status': 'error'}, status=400)

def Main(request):
    return render(request, "main.html")
@login_required(login_url='/login/')
def profile(request):
    message = ""
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == "POST":
        form = UpdateProfileForm(request.POST, request.FILES, instance=request.user)

        if form.is_valid():
            form.save()
            message = "Profile successfully saved!"
            form = UpdateProfileForm(instance=request.user)
    else:
        form = UpdateProfileForm(instance=request.user)


    return render(request, "profile.html", {"form": form, "message": message})
    
def logout_view(request):
    logout(request)
    return redirect('home') 

class RegisterView(CreateView):
    template_name = 'register.html'
    form_class = UserCreationForm
    success_url = reverse_lazy('Login')

class LoginView(FormView):
    template_name = 'login.html'
    form_class = LoginForm
    success_url = reverse_lazy('Main') 

    def form_valid(self, form):
        username = form.cleaned_data['username']
        password = form.cleaned_data['password']
        user = authenticate(self.request, username=username, password=password)
        if user is not None:
            login(self.request, user)
            return super().form_valid(form)
        else:
            form.add_error(None, 'Невірний логін або пароль')
            return self.form_invalid(form)

def tactic_detail_view(request, pk):
  tactic = get_object_or_404(ChessTactic, pk=pk)
  moves_list = [m.strip() for m in tactic.moves_sequence.split(',')]
  return render(
      request, 'chess_app/tactic.html', {'tactic': tactic, 'moves_list': moves_list}
  )

def Caro_kan_view(request):
  tactic, created = ChessTactic.objects.get_or_create(
      title='Защита Каро-Канн',
      defaults={
          'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          'moves_sequence': 'e4,c6,d4,d5',
          'description': (
              'Классический полуоткрытый дебют за черных против хода 1.e4.'
          ),
      },
  )

  tactic.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  tactic.moves_sequence = 'e4,c6,d4,d5'
  tactic.save()

  moves_list = [m.strip() for m in tactic.moves_sequence.split(',')]
  context = {'tactic': tactic, 'moves_list': moves_list}
  return render(request, 'Caro-kan.html', context)
def chess_board_view(request):

  white_tactics = ChessTactic.objects.filter(color='white')
  black_tactics = ChessTactic.objects.filter(color='black')

  context = {'white_tactics': white_tactics, 'black_tactics': black_tactics}
  return render(
      request, 'board.html', context
  )