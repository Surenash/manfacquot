from django.shortcuts import render

def index_view(request):
    """
    Serves the main entry point of the React application.
    """
    return render(request, 'index.html')
